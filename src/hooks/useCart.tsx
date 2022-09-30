import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  // useEffect(() => {
  //   console.log("chamado")
  //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  // }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const {data: stock} = await api.get<Stock>(`stock/${productId}`);
      // copia o carrinho
      const updatedCart  = [...cart];
      const productAlreadyExists = updatedCart.find(product => product.id === productId);
    
      const currentAmount = productAlreadyExists ? productAlreadyExists.amount : 0;
      const amount = currentAmount + 1
      if(amount > stock.amount ){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      // se produto já estiver no carrinho, adicionar uma unidade
      if(productAlreadyExists){
        productAlreadyExists.amount = amount;
      } else {     
        const {data: product} = await api.get<Product>(`products/${productId}`);      
        const newProduct = {
          ...product,
          amount: 1
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productExists = cart.find(product => product.id === productId);
      if(!productExists){
        throw new Error("Produto não existe") 
      }
      const updatedCart = cart.filter(product => product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;
      
      const {data: stock} = await api.get<Stock>(`stock/${productId}`);
      
      if(amount > stock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = [...cart];
      
      const productExists = updatedCart.find(product => product.id === productId);
      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }else {
        throw new Error("Produto não existe");
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
