def withChecks(String checkName, Closure body) {
    publishChecks name: checkName, status: 'IN_PROGRESS'
    try {
        body()
        publishChecks name: checkName, status: 'COMPLETED', conclusion: 'SUCCESS'
    } catch (Exception e) {
        publishChecks name: checkName, status: 'COMPLETED', conclusion: 'FAILURE',
            summary: "Stage failed: ${e.message}"
        throw e
    }
}

pipeline {
    agent { label 'jenkins-agent-node' }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        YARN_CACHE_FOLDER = '/opt/yarn-cache'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Determine Changes') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.RUN_MOBILE = 'true'
                        env.RUN_BACKEND = 'true'
                        env.RUN_ADMIN = 'true'
                    } else {
                        sh 'git fetch origin main:refs/remotes/origin/main'
                        def changes = sh(script: 'git diff --name-only origin/main...HEAD', returnStdout: true).trim()
                        def changedFiles = changes ? changes.split('\n').toList() : []

                        // Root-level files (yarn.lock, tsconfig.json, etc.) affect all workspaces
                        def hasRootChanges = changedFiles.any { !it.contains('/') }

                        env.RUN_MOBILE = (hasRootChanges || changedFiles.any { it.startsWith('mobile/') }).toString()
                        env.RUN_BACKEND = (hasRootChanges || changedFiles.any { it.startsWith('backend/') }).toString()
                        env.RUN_ADMIN = (hasRootChanges || changedFiles.any { it.startsWith('admin/') }).toString()
                    }

                    env.HAS_CHANGES = (env.RUN_MOBILE == 'true' || env.RUN_BACKEND == 'true' || env.RUN_ADMIN == 'true').toString()
                }
            }
        }

        stage('Setup') {
            when { environment name: 'HAS_CHANGES', value: 'true' }
            steps {
                script {
                    withChecks('Setup') {
                        sh 'yarn install --immutable'
                        sh 'yarn workspace backend prisma generate'
                    }
                }
            }
        }

        stage('Code Quality') {
            when { environment name: 'HAS_CHANGES', value: 'true' }
            parallel {
                stage('Mobile') {
                    when { environment name: 'RUN_MOBILE', value: 'true' }
                    steps {
                        script {
                            withChecks('Format & Lint: Mobile') {
                                sh 'yarn workspace mobile run format_lint:ci'
                            }
                        }
                    }
                }
                stage('Backend') {
                    when { environment name: 'RUN_BACKEND', value: 'true' }
                    steps {
                        script {
                            withChecks('Format & Lint: Backend') {
                                sh 'yarn workspace backend run format_lint:ci'
                            }
                        }
                    }
                }
                stage("Backend Test") {
                    when { environment name: 'RUN_BACKEND', value: 'true' }
                    steps {
                        script {
                            withChecks('Test: Backend') {
                                sh 'yarn workspace backend run test'
                            }
                        }
                    }
                }
                stage('Admin') {
                    when { environment name: 'RUN_ADMIN', value: 'true' }
                    steps {
                        script {
                            // withChecks('Lint: Admin') {
                            //     sh 'yarn workspace admin run format_lint:ci'
                            // }
                            echo "Skipping..."
                        }
                    }
                }
            }
        }

        stage('Docker Login') {
            when { branch 'main' }
            steps {
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    withCredentials([
                        usernamePassword(credentialsId: 'registry-credentials', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')
                    ]) {
                        sh "echo \"\$REG_PASS\" | docker login registry.anora-app.com -u \"\$REG_USER\" --password-stdin"
                    }
                }
            }
        }

        stage('Build & Push Images') {
            when { branch 'main' }
            parallel {
                stage('Backend Image') {
                    steps {
                        script {
                            withChecks('Build & Push: Backend') {
                                sh "docker pull registry.anora-app.com/backend:latest || true"
                                sh """
                                    docker build -f backend/Dockerfile \
                                        --build-arg BUILDKIT_INLINE_CACHE=1 \
                                        --cache-from registry.anora-app.com/backend:latest \
                                        -t registry.anora-app.com/backend:${env.GIT_SHA} \
                                        -t registry.anora-app.com/backend:latest \
                                        .
                                    docker push registry.anora-app.com/backend:${env.GIT_SHA}
                                    docker push registry.anora-app.com/backend:latest
                                    docker rmi registry.anora-app.com/backend:${env.GIT_SHA} registry.anora-app.com/backend:latest || true
                                """
                            }
                        }
                    }
                }
                stage('Admin Image') {
                    steps {
                        script {
                            withChecks('Build & Push: Admin') {
                                sh "docker pull registry.anora-app.com/admin:latest || true"
                                sh """
                                    docker build -f admin/Dockerfile \
                                        --build-arg BUILDKIT_INLINE_CACHE=1 \
                                        --build-arg NEXT_PUBLIC_API_URL=https://api.anora-app.com/v1 \
                                        --cache-from registry.anora-app.com/admin:latest \
                                        -t registry.anora-app.com/admin:${env.GIT_SHA} \
                                        -t registry.anora-app.com/admin:latest \
                                        .
                                    docker push registry.anora-app.com/admin:${env.GIT_SHA}
                                    docker push registry.anora-app.com/admin:latest
                                    docker rmi registry.anora-app.com/admin:${env.GIT_SHA} registry.anora-app.com/admin:latest || true
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                script {
                    withChecks('Deploy') {
                        build job: 'Project Anon Infra/main', wait: true
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
