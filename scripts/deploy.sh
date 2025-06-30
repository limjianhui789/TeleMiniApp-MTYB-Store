#!/bin/bash

# ============================================================================
# MTYB Shop Deployment Script
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="MTYB Shop"
BUILD_DIR="dist"
BACKUP_DIR="backups"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo " $1"
    echo "============================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified. Usage: ./deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

print_header "Deploying $PROJECT_NAME to $ENVIRONMENT"

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Pre-deployment checks
print_header "Pre-deployment Checks"

# Check Node.js version
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found"
    exit 1
fi
print_success "Environment file found: $ENV_FILE"

# Install dependencies
print_header "Installing Dependencies"
npm ci
print_success "Dependencies installed"

# Run linting
print_header "Code Quality Checks"
npm run lint
print_success "Linting passed"

# Run type checking
npm run typecheck
print_success "Type checking passed"

# Run tests (if available)
if npm run | grep -q "test"; then
    npm run test
    print_success "Tests passed"
else
    print_warning "No tests found"
fi

# Build the application
print_header "Building Application"
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build -- --mode production
else
    npm run build -- --mode staging
fi
print_success "Build completed"

# Create backup if deploying to production
if [ "$ENVIRONMENT" = "production" ]; then
    print_header "Creating Backup"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
    
    if [ -d "$BUILD_DIR" ]; then
        tar -czf "$BACKUP_NAME" "$BUILD_DIR" 2>/dev/null || true
        print_success "Backup created: $BACKUP_NAME"
    fi
fi

# Deployment steps based on environment
print_header "Deployment"

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    print_warning "Production deployment requires manual verification"
    print_warning "Please review the build output in $BUILD_DIR"
    print_warning "Deploy to your production server manually or configure CI/CD"
    
    # Basic security check
    if grep -r "localhost" "$BUILD_DIR" 2>/dev/null; then
        print_error "Found localhost references in production build!"
        exit 1
    fi
    
    if grep -r "development" "$BUILD_DIR" 2>/dev/null; then
        print_error "Found development references in production build!"
        exit 1
    fi
    
    print_success "Production build security checks passed"
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    # Staging deployment (example for GitHub Pages)
    print_success "Staging build ready for deployment"
    
    # If deploying to GitHub Pages
    if command -v gh &> /dev/null; then
        print_warning "To deploy to GitHub Pages, run: npm run deploy"
    fi
fi

# Post-deployment checks
print_header "Post-deployment Information"

# Build size analysis
if [ -d "$BUILD_DIR" ]; then
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    # List largest files
    echo "Largest files in build:"
    find "$BUILD_DIR" -type f -exec du -h {} + | sort -rh | head -10
fi

# Generate deployment report
REPORT_FILE="deployment_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
============================================================================
MTYB Shop Deployment Report
============================================================================
Environment: $ENVIRONMENT
Timestamp: $(date)
Node.js Version: $NODE_VERSION
npm Version: $NPM_VERSION
Build Size: $BUILD_SIZE

Build Contents:
$(ls -la "$BUILD_DIR" 2>/dev/null || echo "Build directory not found")

Git Information:
Branch: $(git branch --show-current 2>/dev/null || echo "Not available")
Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not available")
Status: $(git status --porcelain 2>/dev/null || echo "Not available")

Environment Variables Used:
$(grep "^VITE_" "$ENV_FILE" | sed 's/=.*/=***/' 2>/dev/null || echo "Environment file not readable")
============================================================================
EOF

print_success "Deployment report generated: $REPORT_FILE"

print_header "Deployment Complete"
print_success "$PROJECT_NAME successfully prepared for $ENVIRONMENT deployment"

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    print_warning "IMPORTANT: Manual steps required for production:"
    echo "1. Review the build in $BUILD_DIR"
    echo "2. Upload to your production server"
    echo "3. Update environment variables on server"
    echo "4. Configure SSL certificates"
    echo "5. Test the deployment thoroughly"
fi