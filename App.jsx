import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    const { data } = await supabase.from("products").select();
    setProducts(data);
  }

  return (
    <ul>
      {products.map((product) => (
        <div>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>${product.price}</p>
          <p>Creado: {new Date(product.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </ul>
  );
}

export default App;