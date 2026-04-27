pipeline {
    agent any

    environment {
        // --- Configuration Variables ---
        REGISTRY = "ghcr.io"
        GITHUB_USER = "khaelano" 
        REPO_NAME = "devsecops-presensi"         
        IMAGE_NAME = "${REGISTRY}/${GITHUB_USER}/${REPO_NAME}"
        
        IMAGE_TAG = "${env.BUILD_ID}" 
        
        SSH_TARGET = "jenkins@10.34.100.181"
        
        // CORRECTION 1: These must be plain strings representing the Jenkins IDs
        SSH_CREDS_ID = "deploy-ssh-key"
        GHCR_CREDS_ID = "ghcr-creds-4"

        // Container envs (Public)
        NEXT_PUBLIC_SUPABASE_URL = "https://jfgrtmdripbaisdcpini.supabase.co"
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZAgi28rahzB69xNcTMXwow_jDl44hqB"
        
        // This remains correct: resolves the Secret Text into the variable
        DATABASE_URL = credentials("db-url-4")
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"
                    
                    // CORRECTION 2: Inject NEXT_PUBLIC_ variables as build arguments
                    sh """
                    docker build \\
                        --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \\
                        --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \\
                        -t ${IMAGE_NAME}:${IMAGE_TAG} \\
                        -t ${IMAGE_NAME}:latest .
                    """
                }
            }
        }

        stage('Publish to GHCR') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.GHCR_CREDS_ID, passwordVariable: 'GHCR_TOKEN', usernameVariable: 'GHCR_USER')]) {
                    sh '''
                        echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
                        
                        docker push ''' + env.IMAGE_NAME + ''':''' + env.IMAGE_TAG + '''
                        docker push ''' + env.IMAGE_NAME + ''':latest
                    '''
                }
            }
        }

        stage('Deploy via SSH') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.GHCR_CREDS_ID, passwordVariable: 'GHCR_TOKEN', usernameVariable: 'GHCR_USER')]) {
                    sshagent(credentials: [env.SSH_CREDS_ID]) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ${SSH_TARGET} '
                            
                            echo "${GHCR_TOKEN}" | docker login ${REGISTRY} -u "${GHCR_USER}" --password-stdin

                            docker pull ${IMAGE_NAME}:${IMAGE_TAG}

                            docker stop absensi-cicd || true
                            docker rm absensi-cicd || true

                            # We keep the NEXT_PUBLIC vars here as well for server-side rendering fallbacks
                            docker run -d \\
                                --name absensi-cicd \\
                                --restart unless-stopped \\
                                -p 3000:3000 \\
                                -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \\
                                -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \\
                                -e DATABASE_URL="${DATABASE_URL}" \\
                                ${IMAGE_NAME}:${IMAGE_TAG}

                            docker image prune -a -f --filter "until=24h"
                            
                            docker logout ${REGISTRY}
                        '
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Use env. prefix to ensure Groovy finds the variable
            sh "docker logout ${env.REGISTRY} || true"
            sh "docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} || true"
            sh "docker rmi ${env.IMAGE_NAME}:latest || true"
        }
    }
}