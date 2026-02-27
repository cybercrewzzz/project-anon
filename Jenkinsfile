pipeline {
    agent { label 'jenkins-agent-node' }

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage("Setup") {
            steps {
                echo 'Installing dependencies...'
                sh 'yarn workspaces focus mobile'
            }
        }

        stage('Code Quality') {
            parallel {
                stage("Format Check") {
                    steps {
                        echo "Checking formatting..."
                        sh 'yarn workspace mobile run format:ci'
                    }
                }

                stage("Lint Check") {
                    steps {
                        echo "Running Linter..."
                        sh 'yarn workspace mobile run lint:ci'
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
