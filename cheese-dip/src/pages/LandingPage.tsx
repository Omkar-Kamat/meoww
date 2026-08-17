import { Link } from "react-router-dom";
import { useAuthSession } from "../features/auth";

export const LandingPage = () => {
  const { user } = useAuthSession();

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to Meoww</h1>
      <p>Connect with people instantly.</p>
      
      {user ? (
        <div>
          <p>Hello, {user.name}!</p>
          <Link to="/chat">
            <button style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>Go to Chat</button>
          </Link>
        </div>
      ) : (
        <div>
          <Link to="/login">
            <button style={{ padding: "10px 20px", fontSize: "16px", marginRight: "10px", cursor: "pointer" }}>Login</button>
          </Link>
          <Link to="/signup">
            <button style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>Sign Up</button>
          </Link>
        </div>
      )}
    </div>
  );
};
