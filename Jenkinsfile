pipeline {
    agent { label 'jenkins-agent-node' }

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Setup') {
            steps {
                sh 'yarn install'
            }
        }

        stage('Code Quality') {
            parallel {
                stage('Mobile') {
                    steps {
                        // 1. Mark as In Progress in GitHub
                        publishChecks name: 'Lint: Mobile', status: 'IN_PROGRESS'
                        
                        // 2. catchError allows the post{} block to run even if the script fails
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            sh 'yarn workspace mobile run format_lint:ci'
                        }
                    }
                    post {
                        // 3. Update GitHub with the final result
                        success {
                            publishChecks name: 'Lint: Mobile', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                        failure {
                            publishChecks name: 'Lint: Mobile', status: 'COMPLETED', conclusion: 'FAILURE'
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        publishChecks name: 'Lint: Backend', status: 'IN_PROGRESS'
                        
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            sh 'yarn workspace backend run format_lint:ci'
                        }
                    }
                    post {
                        success {
                            publishChecks name: 'Lint: Backend', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                        failure {
                            publishChecks name: 'Lint: Backend', status: 'COMPLETED', conclusion: 'FAILURE'
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                publishChecks name: 'Build: Backend', status: 'IN_PROGRESS'
                
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    echo "Build in progress..."
                }
            }
            post {
                success {
                    publishChecks name: 'Build: Backend', status: 'COMPLETED', conclusion: 'SUCCESS'
                }
                failure {
                    publishChecks name: 'Build: Backend', status: 'COMPLETED', conclusion: 'FAILURE'
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