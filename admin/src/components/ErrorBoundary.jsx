import { Component } from "react";

function loginHref() {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/login`;
}

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
          <h2>Loi hien thi trang</h2>
          <p style={{ color: "#64748b" }}>{this.state.error.message}</p>
          <button type="button" className="btn btn-primary" onClick={() => {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            window.location.href = loginHref();
          }}>Dang nhap lai</button>
        </div>
      );
    }
    return this.props.children;
  }
}