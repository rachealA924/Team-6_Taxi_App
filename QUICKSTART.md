# Quick Start Guide

Get your NYC Taxi Trip Analytics Dashboard up and running in minutes!

## 🚀 Quick Start (Frontend Only)

### Option 1: Direct Browser Opening (Simplest)
1. Navigate to the project folder
2. Double-click `index.html`
3. The dashboard opens in your default browser

### Option 2: Using a Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

## 📊 What You'll See

The dashboard includes:
- **4 Key Metrics Cards**: Total trips, average fare, duration, and distance
- **4 Interactive Charts**: Hourly distribution, fare distribution, passenger count, payment types
- **Filter Section**: Filter by date, passengers, fare, and distance
- **Data Table**: Searchable and sortable trip details
- **Insights Section**: Auto-generated insights from the data

## 🎯 Try These Features

1. **Apply Filters**
   - Set a date range
   - Filter by passenger count
   - Adjust fare or distance ranges
   - Click "Apply Filters"

2. **Search Trips**
   - Type in the search box
   - Results update in real-time

3. **Sort Data**
   - Select a sort option from dropdown
   - Click column headers to toggle order

4. **Navigate Pages**
   - Use Previous/Next buttons
   - View 20 trips per page

## 📁 Project Structure

```
Team-6_Taxi_App/
├── index.html       ← Main dashboard
├── styles.css       ← All styling
├── app.js          ← All functionality
├── README.md       ← Full documentation
└── QUICKSTART.md   ← This file
```

## 🔧 Customization

### Change Sample Data
Edit the `sampleTrips` array in `app.js` (lines 7-50)

### Modify Colors
Edit CSS variables in `styles.css` (lines 8-18)

### Adjust Items Per Page
Change `itemsPerPage` in `app.js` (line 5)

## 🐛 Troubleshooting

**Charts not showing?**
- Check browser console for errors
- Ensure Chart.js is loading (check network tab)

**Filters not working?**
- Open browser console (F12)
- Check for JavaScript errors

**Styling looks wrong?**
- Clear browser cache
- Check that styles.css is loading

## 📝 Next Steps

1. **Test all features** - Try every filter, sort, and search
2. **Review the code** - Understand how it works
3. **Plan backend** - Design your API endpoints
4. **Prepare data** - Download and process the NYC dataset

## 💡 Tips

- Use Chrome DevTools to inspect elements
- Check console for helpful logs
- Sample data is limited - backend will have more
- All code is commented for clarity

## 🎓 Learning Resources

- **Chart.js**: https://www.chartjs.org/docs/
- **CSS Grid**: https://css-tricks.com/snippets/css/complete-guide-grid/
- **JavaScript ES6**: https://javascript.info/

## 📞 Need Help?

1. Check the full README.md
2. Review code comments
3. Check browser console for errors
4. Ask your team members

---

**Ready to build the backend?** Check `backend/README.md` for implementation plans!

