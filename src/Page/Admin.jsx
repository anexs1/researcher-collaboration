import React from "react";

export default function Admin() {
  return (
    <div>
      <Sidebar>
        <Menu>
          <MenuItem icon={<BarChart />}>Dashboard</MenuItem>
          <MenuItem icon={<Users />}>Users</MenuItem>
          <MenuItem icon={<FileText />}>Reports</MenuItem>
          <MenuItem icon={<ShieldCheck />}>Security</MenuItem>
        </Menu>
      </Sidebar>
      <Card>
        <CardContent>
          <h1>Admin Dashboard</h1>
          <Button>Click Me</Button>
        </CardContent>
      </Card>
    </div>
  );
}
