import { useState } from 'react';
import { menuChannels } from '../../data/menuData.js';
import { formatSyncStatus } from './SyncHealthSummary.jsx';

function ItemPricingChannelsTab({ item }) {
  const [basePrice, setBasePrice] = useState(item.basePrice.toFixed(2));

  return (
    <div className="card border-0 owner-card">
      <div className="card-body">
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="editorBasePrice">
              Base price
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                className="form-control"
                id="editorBasePrice"
                min="0"
                onChange={(event) => setBasePrice(event.target.value)}
                step="0.01"
                type="number"
                value={basePrice}
              />
            </div>
          </div>
        </div>

        <div className="vstack gap-3">
          {menuChannels.map((channel) => {
            const channelState = item.channels[channel] ?? { status: 'pending', enabled: true };
            const channelPrice = channelState.priceOverride ?? Number(basePrice || 0);

            return (
              <div className="menu-channel-row" key={channel}>
                <div>
                  <div className="fw-semibold">{channel}</div>
                  <div className="text-secondary small">{channelState.enabled ? 'Connected' : 'Not connected'}</div>
                </div>
                <div className="text-sm-end">
                  <span className={`menu-status-pill menu-status-${channelState.status}`}>
                    <span className="menu-status-dot" aria-hidden="true" />
                    {formatSyncStatus(channelState.status)}
                  </span>
                  <div className="small text-secondary mt-1">
                    ${Number(channelPrice).toFixed(2)}
                    {channelState.priceOverride ? ' channel override' : ' base price'}
                  </div>
                  {channelState.status === 'failed' ? (
                    <div className="small text-danger mt-1">{channelState.note || 'Last sync attempt failed.'}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ItemPricingChannelsTab;
