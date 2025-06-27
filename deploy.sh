#!/bin/bash

# Zotero MCP Server - GCP Cloud Run Deployment Script
# This script deploys the Zotero MCP server to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="zotero-mcp-server"

# Environment variables (these should be set before running)
ZOTERO_API_KEY="${ZOTERO_API_KEY:-}"
ZOTERO_USER_ID="${ZOTERO_USER_ID:-}"
ZOTERO_COLLECTION_KEY="${ZOTERO_COLLECTION_KEY:-}"

echo -e "${GREEN}🚀 Zotero MCP Server - Cloud Run Deployment${NC}"
echo "=========================================="

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Google Cloud CLI (gcloud) is not installed${NC}"
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            echo -e "${RED}❌ No GCP project configured${NC}"
            echo "Please run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    echo -e "${YELLOW}📋 Using project: ${PROJECT_ID}${NC}"
}

# Validate environment variables
validate_env_vars() {
    echo "Validating environment variables..."
    
    if [ -z "$ZOTERO_API_KEY" ]; then
        echo -e "${RED}❌ ZOTERO_API_KEY environment variable is required${NC}"
        echo "Get your API key from: https://www.zotero.org/settings/keys"
        exit 1
    fi
    
    if [ -z "$ZOTERO_USER_ID" ]; then
        echo -e "${RED}❌ ZOTERO_USER_ID environment variable is required${NC}"
        echo "Your numeric Zotero user ID"
        exit 1
    fi
    
    if [ -z "$ZOTERO_COLLECTION_KEY" ]; then
        echo -e "${RED}❌ ZOTERO_COLLECTION_KEY environment variable is required${NC}"
        echo "The specific collection key to access"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment variables validated${NC}"
}

# Enable required APIs
enable_apis() {
    echo "Enabling required GCP APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    echo -e "${GREEN}✅ APIs enabled${NC}"
}

# Build and deploy
build_and_deploy() {
    echo "Building and deploying to Cloud Run..."
    
    # Build the container
    echo "🔨 Building Docker image..."
    docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME} .
    
    # Push to Container Registry
    echo "📤 Pushing to Container Registry..."
    docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}
    
    # Deploy to Cloud Run
    echo "🚀 Deploying to Cloud Run..."
    gcloud run deploy ${SERVICE_NAME} \
        --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --set-env-vars "ZOTERO_API_KEY=${ZOTERO_API_KEY},ZOTERO_USER_ID=${ZOTERO_USER_ID},ZOTERO_COLLECTION_KEY=${ZOTERO_COLLECTION_KEY}" \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300
}

# Get service URL
get_service_url() {
    echo "Getting service URL..."
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "🌐 Your Zotero MCP Server is now accessible at:"
    echo -e "${GREEN}${SERVICE_URL}${NC}"
    echo ""
    echo "📚 API endpoints:"
    echo "  Health check: ${SERVICE_URL}/health"
    echo "  API docs: ${SERVICE_URL}/"
    echo "  Collection info: ${SERVICE_URL}/collection/info"
    echo ""
    echo "🧪 Test the deployment:"
    echo "  curl ${SERVICE_URL}/health"
}

# Main execution
main() {
    check_requirements
    get_project_id
    validate_env_vars
    enable_apis
    build_and_deploy
    get_service_url
}

# Run main function
main "$@"