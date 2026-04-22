import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  const [products, setProducts] = useState([]);
  // Estados para el formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    const { data } = await supabase.from("products").select().order('created_at', { ascending: false });
    setProducts(data);
  }

  function limpiarFormulario(e) {
    e.preventDefault();
    setName("");
    setDescription("");
    setPrice("");
    setFile(null);
    e.target.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert("Por favor, selecciona una imagen");
    if (editando) {
      editProduct(idEditando);
      return;
    }
    setLoading(true);
    try {
      // 1. Subir imagen
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 3. Insertar en base de datos
      const { error: insertError } = await supabase.from("products").insert([
        {
          name,
          description,
          price: parseFloat(price),
          image_url: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      // 4. Limpiar formulario y refrescar lista
      limpiarFormulario(e);
      getProducts();
      alert("Producto creado con éxito");
    } catch (error) {
      console.error(error);
      alert("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  }

  async function editProduct(id) {
    const { data } = await supabase.from("products").select().eq("id", id);
    setName(data[0].name);
    setDescription(data[0].description);
    setPrice(data[0].price);
    setFile(data[0].image_url);
    setEditando(true);
    setIdEditando(id);
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return alert("Error al eliminar el producto");
    getProducts();
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <h1 className="bg-slate-800 p-6 text-center text-3xl font-bold">Panel de Productos</h1>

      {/* Formulario de Creación */}
      <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-lg shadow-xl my-8">
        <h2 className="text-xl mb-4 border-b border-slate-700 pb-2">Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text" placeholder="Nombre" className="p-2 rounded bg-slate-700 outline-none"
            value={name} onChange={(e) => setName(e.target.value)} required
          />
          <textarea
            placeholder="Descripción" className="p-2 rounded bg-slate-700 outline-none"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number" placeholder="Precio" className="p-2 rounded bg-slate-700 outline-none"
            value={price} onChange={(e) => setPrice(e.target.value)} required
          />
          <input
            type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            onChange={(e) => setFile(e.target.files[0])} required
          />
          {editando && (
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="bg-yellow-600 hover:bg-yellow-500 p-2 rounded font-bold transition-colors cursor-pointer"
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Guardando..." : editando ? "Actualizar Producto" : "Crear Producto"}
          </button>
        </form>
      </div>

      {/* Listado de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {products.map((product) => (
          <div key={product.id} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800 shadow-lg flex flex-col">
            <div className="h-48 overflow-hidden bg-slate-700">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-slate-400 text-sm my-2 flex-grow">{product.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-green-400 font-bold text-xl">${product.price}</span>
                <span className="text-xs text-slate-500">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between mt-4 gap-2">
                <button
                  onClick={() => editProduct(product.id)}
                  className="bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="bg-red-600 hover:bg-red-500 p-2 rounded font-bold transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;