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
                    when {
                        changeset 'mobile/**'
                    }
                    steps {
                        sh 'yarn workspace mobile run format_lint:ci'
                    }
                }
                stage('Backend') {
                    when {
                        changeset 'backend/**'
                    }
                    steps {
                        sh 'yarn workspace backend run format_lint:ci'
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
