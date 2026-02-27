pipeline {
    agent {label "jenkins-agent-node"}

    stages {
        stage('Format & Lint') {
            steps {
                echo "Formatting & Linting.."
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
