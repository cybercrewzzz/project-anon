@Library('shared-library') _

pipeline {
    agent { label 'jenkins-agent-node' }

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        SETUP = "fullstack"
    }

    stages {
        stage("Setup") {
            when {
                anyOf {
                    branch "main"
                    allOf {
                        changeset "mobile/**"
                        changeset "backend/**"
                    }
                    changeset "*"
                    not {
                        anyOf {
                            changeset "mobile/**"
                            changeset "backend/**"
                        }
                    }
                }
            }
            steps {
                script {
                    withGitHubCheck('Setup') {
                        sh 'yarn install --immutable'
                    }
                }
            }
        }
        stage('Setup Mobile') {
            when {
                changeset "mobile/**"
                not {
                    anyOf {
                        branch "main"
                        changeset "backend/**"
                        changeset "*"
                    }
                }
            }
            steps {
                script {
                    withGitHubCheck('Setup: Mobile') {
                        sh 'yarn workspaces focus mobile'
                        env.SETUP = "mobile"
                    }
                }
            }
        }
        stage('Setup Backend') {
            when {
                changeset "backend/**"
                not {
                    anyOf {
                        branch "main"
                        changeset "mobile/**"
                        changeset "*"
                    }
                }
            }
            steps {
                script {
                    withGitHubCheck('Setup: Backend') {
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
                                withGitHubCheck('Lint: Mobile') {
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
            when {
                branch "main"
                not {
                    environment name: "SETUP", value: "mobile"
                }
            }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        withGitHubCheck('Build: Backend') {
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
