# Huong dan deploy len VPS

## 1. VPS moi
ssh root@IP_VPS
sudo bash deploy/setup-vps.sh

## 2. Clone
cd /var/www
git clone https://github.com/thangcomputer/THANGTINHOC.git thangtinhoc
cd thangtinhoc
cp deploy/deploy.conf.example deploy/deploy.conf
nano deploy/deploy.conf

## 3. Deploy
sudo bash deploy/deploy.sh

## 4. DNS: A record @ www admin -> IP VPS

## 5. SSL
certbot --nginx -d domain -d www.domain -d admin.domain
sudo bash deploy/deploy.sh

Tai khoan seed: admin@thangtinhoc.vn / admin123 — doi ngay!
