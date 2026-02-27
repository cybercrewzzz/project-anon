@Library('my-shared-library') _

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
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            script {
                                withGitHubCheck('Lint: Mobile') {
                                    sh 'yarn workspace mobile run format_lint:ci'
                                }
                            }
                        }
                    }
                }
                stage('Backend') {
                    steps {
                        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                            script {
                                withGitHubCheck('Lint: Backend') {
                                    sh 'yarn workspace backend run format_lint:ci'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        withGitHubCheck('Build: Backend') {
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
