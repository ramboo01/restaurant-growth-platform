import { useState, useEffect, useContext } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { fetchMenuItems, updateMenuItem } from '../../services/menuService.js';

function Staff86BoardPage() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { socket } = useSocket();

  const loadData = async () => {
    try {
      const fetchedItems = await fetchMenuItems();
      setItems(
        (Array.isArray(fetchedItems) ? fetchedItems : []).map((item) => ({
          ...item,
          isAvailable: item.isAvailable !== false && item.isAvailable !== 0 && item.isAvailable !== '0',
          price: Number(item.price || 0)
        }))
      );
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.restaurantId]);

  useEffect(() => {
    if (!socket) return;
    const handleMenuItemUpdated = (updatedItem) => {
      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id === updatedItem.id) {
            return {
              ...item,
              ...updatedItem,
              isAvailable: updatedItem.isAvailable !== false && updatedItem.isAvailable !== 0 && updatedItem.isAvailable !== '0',
              price: Number(updatedItem.price || item.price || 0)
            };
          }
          return item;
        })
      );
    };

    socket.on('menuItemUpdated', handleMenuItemUpdated);
    return () => {
      socket.off('menuItemUpdated', handleMenuItemUpdated);
    };
  }, [socket]);

  const toggleAvailability = async (item) => {
    const willRestore = !item.isAvailable;
    
    // Optimistic UI update
    setItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return { ...i, isAvailable: willRestore };
      }
      return i;
    }));

    try {
      await updateMenuItem(item.id, {
        restaurantId: user?.restaurantId || 1,
        name: item.name,
        description: item.description || '',
        category: item.category || 'Unassigned',
        price: item.price || 0,
        imageUrl: item.imageUrl || '',
        isAvailable: Boolean(willRestore)
      });
      
      if (socket) {
        socket.emit('TOGGLE_ITEM_AVAILABILITY', { itemId: item.id, isAvailable: willRestore });
      }
    } catch (err) {
      console.error('Failed to update item availability:', err);
      // Revert on error
      setItems(prev => prev.map(i => {
        if (i.id === item.id) {
          return { ...i, isAvailable: !willRestore };
        }
        return i;
      }));
    }
  };

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-danger">
            <i className="bi bi-slash-circle-fill me-2"></i> Kitchen 86 Board
          </h2>
          <p className="text-muted mb-0">Fast item availability toggle. Out-of-stock items update guest storefront instantly via WebSockets.</p>
        </div>
        <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 border border-danger border-opacity-25 fw-semibold">
          {items.filter(i => !i.isAvailable).length} Items Out of Stock
        </span>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search menu items to toggle availability..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="list-group shadow-sm rounded-4 overflow-hidden border-0">
        {filteredItems.map(item => (
          <div className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center" key={item.id}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-5">{item.name}</span>
                <span className="badge bg-light text-dark border">{item.category}</span>
              </div>
              <div className="text-muted small">${Number(item.price).toFixed(2)}</div>
            </div>

            <button
              onClick={() => toggleAvailability(item)}
              className={`btn btn-lg ${item.isAvailable ? 'btn-outline-danger' : 'btn-success'} fw-bold px-4 rounded-pill`}
            >
              {item.isAvailable ? (
                <>
                  <i className="bi bi-slash-circle me-1"></i> Mark 86'd (Out of Stock)
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-1"></i> Restore Available
                </>
              )}
            </button>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-5 text-muted bg-white">
            <i className="bi bi-search display-6 d-block mb-3"></i>
            No menu items found matching search filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default Staff86BoardPage;
