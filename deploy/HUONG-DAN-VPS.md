# Huong dan deploy len VPS (admin tai /admin)

## URL dung
- Website: `https://thangtinhoc.edu.vn/`
- Admin: `https://thangtinhoc.edu.vn/admin/login` (cung domain, **khong** dung `admin.thangtinhoc.edu.vn`)

## Loai loi thuong gap
Truy cap `/admin/login` ma thay trang chu client → **Thu muc web sai** (dang tro `client/dist` thay vi `site_dist`).

Kiem tra nhanh tren VPS:
```bash
curl -s https://thangtinhoc.edu.vn/admin/login | grep -o 'src="[^"]*"'
# Phai thay: src="/admin/assets/....js"
# Sai neu thay: src="/assets/....js"
```

## Cap nhat sau khi git pull
```bash
cd /www/wwwroot/thangtinhoc   # hoac APP_DIR cua ban
git pull origin main

cd server && npm ci --omit=dev && npx prisma migrate deploy
pm2 restart thangtinhoc-api

cd ..
bash deploy/rebuild-frontend.sh
```

## aaPanel (Apache) — bat buoc
1. **Website** → **Thu muc web** = `/www/wwwroot/thangtinhoc/site_dist`  
   (KHONG dung `client/dist` hay `admin/dist` rieng)
2. **Reverse proxy** (trong cau hinh site):
   - `/api` → `http://127.0.0.1:5001` (port trong `deploy/deploy.conf`)
   - `/uploads` → `http://127.0.0.1:5001`
3. Bat **Allow .htaccess** / rewrite (Apache: `mod_rewrite` on)
4. File `site_dist/.htaccess` duoc tao tu `deploy/apache/site_dist.htaccess` khi chay `npm run build:merged`
5. Reload web server, xoa cache trinh duyet (Ctrl+Shift+R)

## Dang nhap admin
- Email: `admin@thangtinhoc.vn`
- Mat khau: `admin123` (neu da seed)
- Neu quen mat khau: `cd server && node reset_pw.js`

## VPS moi
```bash
sudo bash deploy/setup-vps.sh
cd /www/wwwroot && git clone https://github.com/thangcomputer/THANGTINHOC.git thangtinhoc
cd thangtinhoc && cp deploy/deploy.conf.example deploy/deploy.conf
nano deploy/deploy.conf
sudo bash deploy/deploy.sh
```
