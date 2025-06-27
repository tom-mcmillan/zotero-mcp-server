# Zotero MCP Server - Cloud Deployment Guide

This guide explains how to deploy the Zotero MCP Server to Google Cloud Run, making it accessible as a remote HTTP service.

## 🏗️ Architecture

The deployment creates:
- **HTTP Server Wrapper**: Exposes all MCP functionality via REST API endpoints
- **Docker Container**: Containerized application for Cloud Run
- **Cloud Run Service**: Scalable, serverless deployment on GCP

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed and configured
3. **Docker** installed locally
4. **Zotero API Credentials**:
   - API Key: Get from https://www.zotero.org/settings/keys
   - User ID: Your numeric Zotero user ID
   - Collection Key: The specific collection to access

## 🚀 Quick Deployment

### Option 1: Automated Deployment Script

```bash
# Set environment variables
export ZOTERO_API_KEY="your_api_key_here"
export ZOTERO_USER_ID="your_user_id_here"
export ZOTERO_COLLECTION_KEY="your_collection_key_here"

# Run deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build and push container
docker build -t gcr.io/YOUR_PROJECT_ID/zotero-mcp-server .
docker push gcr.io/YOUR_PROJECT_ID/zotero-mcp-server

# 4. Deploy to Cloud Run
gcloud run deploy zotero-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/zotero-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ZOTERO_API_KEY=your_key,ZOTERO_USER_ID=your_id,ZOTERO_COLLECTION_KEY=your_collection_key"
```

## 🌐 Remote Server URL

After deployment, your server will be accessible at:
```
https://zotero-mcp-server-[hash]-uc.a.run.app
```

The exact URL will be provided after deployment completes.

## 📚 API Endpoints

Once deployed, your remote server provides these REST endpoints:

### Health & Info
- `GET /health` - Health check
- `GET /` - API documentation

### Collection Management
- `GET /collection/info` - Get collection information
- `GET /collection/items` - List items (params: limit, start, format)
- `GET /collection/items/:itemKey` - Get item details
- `GET /collection/tags` - Get collection tags
- `GET /collection/recent` - Get recent items
- `GET /collection/overview` - Get collection overview

### Search & Analysis
- `POST /collection/search` - Search items
- `POST /collection/bibliography` - Generate bibliography
- `POST /analysis/search` - Search by analysis metadata
- `GET /analysis/summary` - Get analysis summary
- `POST /analysis/compare` - Compare methodologies
- `GET /analysis/gaps` - Extract research gaps

## 🧪 Testing Your Deployment

```bash
# Test health endpoint
curl https://your-service-url/health

# Test collection info
curl https://your-service-url/collection/info

# Test search functionality
curl -X POST https://your-service-url/collection/search \
  -H "Content-Type: application/json" \
  -d '{"query": "climate change", "limit": 5}'
```

## 🔧 Configuration

### Environment Variables
The service requires these environment variables:
- `ZOTERO_API_KEY`: Your Zotero API key
- `ZOTERO_USER_ID`: Your numeric Zotero user ID  
- `ZOTERO_COLLECTION_KEY`: The collection key to access
- `PORT`: Server port (defaults to 8080)

### Resource Limits
Default Cloud Run configuration:
- Memory: 1GB
- CPU: 1 vCPU
- Timeout: 300 seconds
- Min instances: 0 (scales to zero)
- Max instances: 10

## 🔐 Security

The deployment includes:
- CORS enabled for cross-origin requests
- No authentication required (public API)
- Environment variables for sensitive data
- Non-root container user
- Health checks for reliability

## 💰 Cost Estimation

Cloud Run pricing (approximate):
- Free tier: 2 million requests/month
- After free tier: ~$0.40 per million requests
- Memory: ~$0.000001667 per GB-second
- CPU: ~$0.00001 per vCPU-second

For typical research usage, monthly costs should be under $5.

## 🔧 Troubleshooting

### Common Issues

1. **Deployment fails with "API not enabled"**
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```

2. **Environment variables not set**
   - Verify variables are exported before running deploy.sh
   - Check Cloud Run service environment in GCP Console

3. **Zotero API errors**
   - Verify API key has correct permissions
   - Check user ID and collection key are correct
   - Ensure collection is accessible with the API key

4. **Service unreachable**
   - Check Cloud Run logs: `gcloud run logs read --service=zotero-mcp-server`
   - Verify service is deployed in correct region
   - Check IAM permissions

### Viewing Logs

```bash
# View real-time logs
gcloud run logs tail --service=zotero-mcp-server --region=us-central1

# View specific logs
gcloud run logs read --service=zotero-mcp-server --region=us-central1 --limit=50
```

## 🔄 Updates

To update your deployment:

```bash
# Make code changes, then redeploy
./deploy.sh
```

Or manually:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/zotero-mcp-server .
docker push gcr.io/YOUR_PROJECT_ID/zotero-mcp-server
gcloud run deploy zotero-mcp-server --image gcr.io/YOUR_PROJECT_ID/zotero-mcp-server
```

## 🗑️ Cleanup

To remove the deployment:
```bash
gcloud run services delete zotero-mcp-server --region=us-central1
gcloud container images delete gcr.io/YOUR_PROJECT_ID/zotero-mcp-server
```