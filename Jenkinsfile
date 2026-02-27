pipeline {
    agent { label 'jenkins-agent-node' }

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage("Setup") {
            parallel {
                stage("Setup Mobile") {
                    when {
                        changeset "mobile/**"
                    }
                    steps {
                        echo "Setting up mobile..."
                        sh 'yarn workspaces focus mobile'
                    }
                }

                stage("Setup Backend") {
                    when {
                        changeset "backend/**"
                    }
                    steps {
                        echo "Setting up backend..."
                        sh "yarn workspaces focus backend"
                    }
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage("Code Quality Mobile") {
                    when {
                        changeset "mobile/**"
                    }
                    parallel {
                        stage("Format") {
                            steps {
                                echo "Checking formatting..."
                                sh 'yarn workspace mobile run format:ci'
                            }
                        }
                        stage("Lint") {
                            steps {
                                echo "Running Linter..."
                                sh 'yarn workspace mobile run lint:ci'
                            }
                        }
                    }
                }

                stage("Code Quality Backend") {
                    when {
                        changeset "backend/**"
                    }
                    parallel {
                        stage("Format") {
                            steps {
                                echo "Checking formatting..."
                                sh 'yarn workspace backend run format:ci'
                            }
                        }
                        stage("Lint") {
                            steps {
                                echo "Running Linter..."
                                sh 'yarn workspace backend run lint:ci'
                            }
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
