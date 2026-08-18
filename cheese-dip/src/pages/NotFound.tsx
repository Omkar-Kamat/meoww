import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>404 - Page Not Found</h2>
      <Link to="/">Go Home</Link>
    </div>
  );
};
