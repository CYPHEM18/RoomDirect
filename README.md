# RoomDirect (prototype)

Campus hostel marketplace for Nigerian students. **Prototype only**: data is stored in the visitor's own browser, payments are simulated, and login is client-side, so it is NOT secure.

## Fees
Students pay a ₦6,000 booking fee online (₦5,000 platform + ₦1,000 school). Rent is paid to the owner at check-in; the owner confirms arrival with the booking code.

## Pages
- `messages.html` demo student/owner chat (single browser only)
- `school.html` school commission dashboard
- `index.html` browse and filter hostels
- `hostel.html?id=` photos, videos, rooms, demo booking
- `register-student.html`, `register-landlord.html`, `login.html`
- `student.html` bookings, `landlord.html` hostels, photos/videos, rooms, `admin.html` verification and totals

## Demo accounts
- Landlord: landlord@roomdirect.test / landlord1234
- Admin: admin@roomdirect.test / admin1234
- School: school@roomdirect.test / school1234

## Run locally
    npx serve .

(Use a local server, not a double-click on the file, so hashing and IndexedDB work.)

## Deploy: GitHub then Vercel
    git init && git add . && git commit -m "RoomDirect prototype"
    git branch -M main
    git remote add origin https://github.com/YOUR-USER/roomdirect.git
    git push -u origin main

In Vercel: Add New Project, import the repo, Framework Preset "Other", leave the build command and output directory empty, Deploy. Every push to `main` redeploys.

## Prototype limits
- Each visitor only sees their own data (no shared database), so a landlord's uploads are not visible to other people's devices.
- Media limits: photos 5 MB, videos 25 MB, 8 files per hostel.
- Not production-ready: passwords are only hashed in the browser, there are no server checks, and nothing is real money.

## Next: Supabase (auth, database, storage) and Paystack split payments.
