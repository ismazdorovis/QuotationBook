pipeline {
    agent any

    environment {
        PROJECT_DIR = 'QuotationBook'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
            }
        }

        stage('Test') {
            steps {
                echo 'Running integration tests...'
                sh 'docker compose up -d'
                sh 'docker compose exec -T app npm test'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh 'docker compose up --build -d'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up environment...'
        }
        success {
            echo 'Successfully deployed to production!'
        }
        failure {
            echo 'Deployment failed. Please check the logs.'
        }
    }
}