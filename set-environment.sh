#!/bin/bash

# Update repositories and install necessary dependencies
echo "Updating the system and installing dependencies..."
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Install Docker
echo "Installing Docker..."
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add the Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update and install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
echo "Configuring Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Configure Docker for non-root users
echo "Configuring Docker permissions..."
sudo groupadd docker
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo apt install -y docker-compose-plugin

# Install fail2ban
echo "Installing fail2ban..."
sudo apt install -y fail2ban

# Install Volta
echo "Installing Volta..."
curl https://get.volta.sh | bash

# Ensure Volta is correctly sourced in this session
echo "Sourcing Volta environment..."
source ~/.bashrc

# Install Node.js
echo "Installing Node.js LTS via Volta..."
volta install node

# Display installed versions
echo "Installation completed. Checking installed versions:"
docker --version
docker compose version
node --version

echo "To apply group changes without restarting, execute:"
newgrp docker

