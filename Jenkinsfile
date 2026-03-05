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
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
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
                            withChecks('Lint: Mobile') {
                                sh 'yarn workspace mobile run format_lint:ci'
                            }
                        }
                    }
                }
                stage('Backend') {
                    when { environment name: 'RUN_BACKEND', value: 'true' }
                    steps {
                        script {
                            withChecks('Lint: Backend') {
                                sh 'yarn workspace backend run format_lint:ci'
                            }
                        }
                    }
                }
                stage('Admin') {
                    when { environment name: 'RUN_ADMIN', value: 'true' }
                    steps {
                        script {
                            withChecks('Lint: Admin') {
                                sh 'yarn workspace admin run format_lint:ci'
                            }
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            when { branch 'main' }
            steps {
                script {
                    withChecks('Build: Backend') {
                        // WIP
                        echo "Build in progress..."
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
