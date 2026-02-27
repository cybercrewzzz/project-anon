pipeline {
    agent {label "jenkins-agent-node"}

    stages {
        stage('Format & Lint') {
            steps {
                echo "Formatting & Linting.."
                sh "yarn workspaces focus mobile"
                sh "yarn workspaces focus mobile run format:ci"
            }
        }

        stage("Test") {
            steps {
                echo "Testing.."
            }
        }

        stage("Deploy") {
            steps {
                echo "Deploying...."
            }
        }
    }
  }
