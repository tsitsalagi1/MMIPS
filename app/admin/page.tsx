export default function AdminPage() {
  return (
    <main className="container section">
      <h1>Admin review dashboard</h1>
      <p className="lead">This starter page shows the moderation workflow. Protect this route with authentication before launch.</p>
      <section className="card">
        <h2>Review queue</h2>
        <table className="table">
          <thead><tr><th>Submission</th><th>Risk check</th><th>Verification</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>Demo submitted case</td><td>No exact address; no suspect accusation</td><td>Needs family/agency confirmation</td><td>Keep in review</td></tr>
          </tbody>
        </table>
      </section>
      <section className="feature-grid">
        <div className="card"><h3>Before publishing</h3><p>Confirm authority/consent, remove rumors, mask sensitive locations, and confirm the official tip contact.</p></div>
        <div className="card"><h3>Audit log</h3><p>Every edit, publish, hide, or removal should be logged with user, timestamp, reason, and source.</p></div>
        <div className="card"><h3>Removal requests</h3><p>Family correction/removal requests should get fast review and a written resolution.</p></div>
      </section>
    </main>
  );
}
