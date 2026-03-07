import os
import re

files = [
    "src/pages/Hospital/HospitalDashboard.jsx",
    "src/pages/Hospital/IncomingPatientAlert.jsx",
    "src/pages/Hospital/BedManagement.jsx",
    "src/pages/Hospital/PriorityQueue.jsx",
    "src/pages/Admin/AdminDashboard.jsx",
    "src/pages/Admin/AnalyticsPanel.jsx",
    "src/pages/Admin/HospitalRatings.jsx",
    "src/pages/Admin/LiveMap.jsx"
]

color_map = {
    # Backgrounds
    "bg-white": "bg-white dark:bg-gray-900",
    "bg-gray-50": "bg-gray-50 dark:bg-gray-900",
    "bg-slate-50": "bg-slate-50 dark:bg-gray-900",
    "bg-slate-100": "bg-slate-100 dark:bg-gray-800",
    "bg-slate-200": "bg-slate-200 dark:bg-gray-700",
    
    # Text
    "text-gray-900": "text-gray-900 dark:text-white",
    "text-slate-900": "text-slate-900 dark:text-white",
    "text-gray-800": "text-gray-800 dark:text-gray-200",
    "text-slate-800": "text-slate-800 dark:text-gray-200",
    "text-gray-700": "text-gray-700 dark:text-gray-300",
    "text-slate-700": "text-slate-700 dark:text-gray-300",
    "text-gray-600": "text-gray-600 dark:text-gray-400",
    "text-slate-600": "text-slate-600 dark:text-gray-400",
    "text-gray-500": "text-gray-500 dark:text-gray-400",
    "text-slate-500": "text-slate-500 dark:text-gray-400",
    "text-gray-400": "text-gray-400 dark:text-gray-500",
    "text-slate-400": "text-slate-400 dark:text-gray-500",

    # Borders
    "border-gray-100": "border-gray-100 dark:border-gray-800",
    "border-slate-100": "border-slate-100 dark:border-gray-800",
    "border-gray-200": "border-gray-200 dark:border-gray-700",
    "border-slate-200": "border-slate-200 dark:border-gray-700",
    "border-gray-300": "border-gray-300 dark:border-gray-600",
    "border-slate-300": "border-slate-300 dark:border-gray-600",
}

for f in files:
    path = f"/Users/shresthchauhan/Documents/Projects/Hachathon/hack N win/MedManage/client/{f}"
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
        
    with open(path, 'r') as file:
        content = file.read()

    # Apply color map
    for old, new in color_map.items():
        # Avoid double replacing if it already has dark:
        content = re.sub(rf"(?<!dark:){old}\b", new, content)

    # Top-level wrapper replacement
    # Match the class that contains min-h-screen
    content = re.sub(r'className="min-h-screen[^"]*"', 'className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"', content)

    # Insert import
    if "import ThemeToggle" not in content:
        content = re.sub(r"(import React.*?;\n)", r"\1import ThemeToggle from '../../components/shared/ThemeToggle';\n", content, count=1)

    with open(path, 'w') as file:
        file.write(content)

print("Applied color mappings and top level classes.")
