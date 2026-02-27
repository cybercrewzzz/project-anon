def withCheck(String checkName, Closure body) {
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
            when {
                not { branch 'main' }
            }
            steps {
                script {
                    def changes = sh(script: 'git diff --name-only origin/main...HEAD', returnStdout: true).trim()
                    def changedFiles = changes ? changes.split('\n').toList() : []

                    env.HAS_MOBILE_CHANGES = changedFiles.any { it.startsWith('mobile/') }.toString()
                    env.HAS_BACKEND_CHANGES = changedFiles.any { it.startsWith('backend/') }.toString()
                    env.HAS_OTHER_CHANGES = changedFiles.any { !it.startsWith('mobile/') && !it.startsWith('backend/') }.toString()
                }
            }
        }

        stage("Setup") {
            when {
                anyOf {
                    branch "main"
                    environment name: 'HAS_OTHER_CHANGES', value: 'true'
                    allOf {
                        environment name: 'HAS_MOBILE_CHANGES', value: 'true'
                        environment name: 'HAS_BACKEND_CHANGES', value: 'true'
                    }
                }
            }
            steps {
                script {
                    withCheck('Setup') {
                        sh 'yarn install --immutable'
                    }
                }
            }
        }
        stage('Setup Mobile') {
            when {
                allOf {
                    not { branch 'main' }
                    environment name: 'HAS_MOBILE_CHANGES', value: 'true'
                    environment name: 'HAS_BACKEND_CHANGES', value: 'false'
                    environment name: 'HAS_OTHER_CHANGES', value: 'false'
                }
            }
            steps {
                script {
                    withCheck('Setup: Mobile') {
                        sh 'yarn workspaces focus mobile'
                        env.SETUP = "mobile"
                    }
                }
            }
        }
        stage('Setup Backend') {
            when {
                allOf {
                    not { branch 'main' }
                    environment name: 'HAS_BACKEND_CHANGES', value: 'true'
                    environment name: 'HAS_MOBILE_CHANGES', value: 'false'
                    environment name: 'HAS_OTHER_CHANGES', value: 'false'
                }
            }
            steps {
                script {
                    withCheck('Setup: Backend') {
                        sh 'yarn workspaces focus backend'
                        env.SETUP = "backend"
                    }
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage('Mobile') {
                    when {
                        not {
                            environment name: "SETUP", value: "backend"
                        }
                    }
                    steps {
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            script {
                                withCheck('Lint: Mobile') {
                                    sh 'yarn workspace mobile run format_lint:ci'
                                }
                            }
                        }
                    }
                }
                stage('Backend') {
                    when {
                        not {
                            environment name: "SETUP", value: "mobile"
                        }
                    }
                    steps {
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            script {
                                withCheck('Lint: Backend') {
                                    sh 'yarn workspace backend run format_lint:ci'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            when {
                branch "main"
                not {
                    environment name: "SETUP", value: "mobile"
                }
            }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        withCheck('Build: Backend') {
                            // WIP
                            echo "Build in progress..."
                        }
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
