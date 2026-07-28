import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';

function Staff86BoardPage() {
  const [items, setItems] = useState([
    { id: 1, name: 'Crispy Fish Taco', category: 'Tacos', isAvailable: true, price: 4.50 },
    { id: 2, name: 'Birria Ramen Bowl', category: 'Specials', isAvailable: false, price: 14.99 },
    { id: 3, name: 'Churro Ice Cream Sandwich', category: 'Desserts', isAvailable: true, price: 6.00 },
    { id: 4, name: 'Horchata Cold Brew', category: 'Beverages', isAvailable: true, price: 5.25 },
    { id: 5, name: 'Guacamole & Chips', category: 'Sides', isAvailable: true, price: 7.99 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const { socket } = useSocket();

  const toggleAvailability = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.isAvailable;
        if (socket) {
          socket.emit('TOGGLE_ITEM_AVAILABILITY', { itemId: id, isAvailable: nextState });
        }
        return { ...item, isAvailable: nextState };
      }
      return item;
    }));
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="text-muted small">${item.price.toFixed(2)}</div>
            </div>

            <button
              onClick={() => toggleAvailability(item.id)}
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
      </div>
    </div>
  );
}

export default Staff86BoardPage;
