pipeline {
    agent any

    stages {
        stage('Format & Lint') {
            agent {
                label "jenkins-agent-node"
            }
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
