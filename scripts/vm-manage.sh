#!/bin/bash

# Quick VM Management Script

set -e

PROJECT_ID=${PROJECT_ID:-"dl-color-analysis-app"}
ZONE=${ZONE:-"us-central1-a"}
VM_NAME="color-analysis-vm-cpu"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

case "$1" in
    start)
        echo -e "${YELLOW}Starting VM...${NC}"
        gcloud compute instances start $VM_NAME --zone=$ZONE --project=$PROJECT_ID
        echo -e "${GREEN}✅ VM started${NC}"
        ;;
    stop)
        echo -e "${YELLOW}Stopping VM...${NC}"
        gcloud compute instances stop $VM_NAME --zone=$ZONE --project=$PROJECT_ID
        echo -e "${GREEN}✅ VM stopped${NC}"
        ;;
    ssh)
        gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID
        ;;
    logs)
        gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="sudo journalctl -u color-analysis -f"
        ;;
    restart-service)
        echo -e "${YELLOW}Restarting backend service...${NC}"
        gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="sudo systemctl restart color-analysis"
        echo -e "${GREEN}✅ Service restarted${NC}"
        ;;
    status)
        echo -e "${YELLOW}VM Status:${NC}"
        gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT_ID --format="table(name,status,networkInterfaces[0].accessConfigs[0].natIP)"
        echo ""
        echo -e "${YELLOW}Service Status:${NC}"
        gcloud compute ssh $VM_NAME --zone=$ZONE --project=$PROJECT_ID --command="sudo systemctl status color-analysis --no-pager"
        ;;
    ip)
        VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT_ID --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
        echo -e "VM IP: ${GREEN}$VM_IP${NC}"
        echo -e "Backend: ${GREEN}http://$VM_IP:8080${NC}"
        echo -e "API Docs: ${GREEN}http://$VM_IP:8080/docs${NC}"
        ;;
    delete)
        echo -e "${YELLOW}Deleting VM...${NC}"
        gcloud compute instances delete $VM_NAME --zone=$ZONE --project=$PROJECT_ID --quiet
        echo -e "${GREEN}✅ VM deleted${NC}"
        ;;
    *)
        echo "Usage: $0 {start|stop|ssh|logs|restart-service|status|ip|delete}"
        echo ""
        echo "Commands:"
        echo "  start           - Start the VM"
        echo "  stop            - Stop the VM (saves money)"
        echo "  ssh             - SSH into the VM"
        echo "  logs            - View backend service logs"
        echo "  restart-service - Restart the backend service"
        echo "  status          - Show VM and service status"
        echo "  ip              - Show VM IP and URLs"
        echo "  delete          - Delete the VM completely"
        exit 1
        ;;
esac
