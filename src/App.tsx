import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();
const UNSPLASH_API_KEY = import.meta.env.UNSPLASH_API_KEY; 

function App() {
  const [pictures, setPictures] = useState<Array<Schema["Picture"]["type"]>>([]);
  const [loading, setLoading] = useState(false);

  const { signOut } = useAuthenticator();

  function deletePicture(id: string) {
    client.models.Picture.delete({ id });
  }

  useEffect(() => {
    client.models.Picture.observeQuery().subscribe({
      next: (data) => setPictures([...data.items]),
    });
  }, []);

  async function getRandomImage(query: string) {
    // Using Unsplash random image API with search term
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_API_KEY}`
    );
    const b = await response.json();
    return b.urls?.thumb;
  }

  async function createPicture() {
    const name = window.prompt("Enter what kind of picture you'd like:");
    if (!name) return;

    setLoading(true);
    try {
      const imageUrl = await getRandomImage(name);
      await client.models.Picture.create({
        name,
        imageUrl
      });
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to get image. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>My Picture Collection</h1>
      <button 
        onClick={createPicture} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          marginBottom: '20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Getting Image...' : '+ Add New Picture'}
      </button>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '20px' 
      }}>
        {pictures.map((picture) => (
          <div 
            key={picture.id} 
            style={{ 
              position: 'relative',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            <img 
              src={picture.imageUrl!} 
              alt={picture.name!}
              style={{ 
                width: '100%', 
                height: '200px',
                objectFit: 'cover'
              }}
            />
            <div style={{
              padding: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ 
                margin: '0',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {picture.name}
              </p>
              <button
                onClick={() => deletePicture(picture.id)}
                style={{
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
      <button 
        onClick={signOut}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Sign out
      </button>
    </main>
  );
}

export default App;
