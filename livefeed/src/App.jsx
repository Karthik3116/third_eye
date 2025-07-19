import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [devices, setDevices] = useState({});

  const fetchData = async () => {
    try {
      const response = await fetch('https://collegify.pythonanywhere.com/recent_background_api_data');
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <h1>Live Mobile Feed Dashboard</h1>
      <div className="device-grid">
        {Object.entries(devices).map(([deviceName, { data, received_at }]) => (
          <div key={deviceName} className="mobile">
            <div className="mobile-header">
              <span>{deviceName}</span>
              <small>{received_at}</small>
            </div>
            <div className="mobile-screen">
              {data.screenshot_png_b64 ? (
                <img
                  src={`data:image/png;base64,${data.screenshot_png_b64}`}
                  alt="Live Screenshot"
                />
              ) : (
                <p className="no-feed">No screenshot</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
