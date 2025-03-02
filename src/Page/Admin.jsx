import { useState } from "react";
import { Card, CardContent } from "../Component/Card"; // Assuming Card component exists
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar"; // Sidebar library
import { BarChart, Users, FileText, ShieldCheck } from "lucide-react"; // Icon library

export default function Admin() {
  const [selected, setSelected] = useState("Dashboard");

  return (
    <div className="admin-container flex h-screen">
      {/* Sidebar */}
      <Sidebar className="sidebar bg-gray-900 text-white w-64 p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <Menu>
          <MenuItem
            icon={<BarChart />}
            onClick={() => setSelected("Dashboard")}
          >
            Dashboard
          </MenuItem>
          <MenuItem
            icon={<FileText />}
            onClick={() => setSelected("Announcements")}
          >
            Announcements
          </MenuItem>
          <MenuItem icon={<Users />} onClick={() => setSelected("Users")}>
            Users
          </MenuItem>
          <MenuItem
            icon={<ShieldCheck />}
            onClick={() => setSelected("Requests")}
          >
            Collaboration Requests
          </MenuItem>
        </Menu>
      </Sidebar>

      {/* Main Content */}
      <div className="content flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">{selected}</h1>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-700">
              Content for {selected} will be displayed here.
            </p>
            {/* Additional content logic goes here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
