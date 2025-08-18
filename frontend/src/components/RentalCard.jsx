import { Link, useNavigate } from 'react-router-dom';

const RentalCard = ({ rental, onDelete, onEdit, onBook, onMakeAvailable }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800 rounded shadow p-4 flex flex-col relative">
      <Link to={`/rentals/${rental.id}`}>
        {rental.images && rental.images.length > 0 && (
          <img
            src={Array.isArray(rental.images) ? rental.images[0] : JSON.parse(rental.images)[0]}
            alt={rental.title}
            className="w-full h-40 object-cover rounded mb-2"
          />
        )}
        <h4 className="font-bold text-lg mb-1">{rental.title}</h4>
        <p className="text-gray-400 text-sm mb-2">{rental.description?.slice(0, 60)}...</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {rental.mode === 'lodging' ? (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.nightly_price}/night
            </span>
          ) : (
            <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
              KES {rental.price}/month
            </span>
          )}
          <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs">{rental.type}</span>
          <span className="bg-yellow-700 text-white px-2 py-1 rounded text-xs">
            {rental.status === 'booked' ? 'Booked' : (rental.status || 'available')}
          </span>
        </div>
      </Link>
      <div className="flex gap-2 mt-2">
        {onEdit && (
          <button
            onClick={() => onEdit(rental.id)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(rental.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        )}
        {rental.status === 'available' ? (
          <button onClick={onBook}>Mark as Booked</button>
        ) : (
          <button onClick={onMakeAvailable}>Mark as Available</button>
        )}
      </div>
    </div>
  );
}

export default RentalCard;