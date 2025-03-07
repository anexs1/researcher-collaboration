import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Admin from "./Admin";
import Login from "./Login";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/admin" component={Admin} />
        <Route path="/login" component={Login} />
        {/* Add more routes as needed */}
      </Switch>
    </Router>
  );
}

export default App;
