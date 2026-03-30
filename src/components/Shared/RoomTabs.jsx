import useKayanStore from '@/store/useKayanStore'

export default function RoomTabs({ selected, onSelect }) {
  const rooms = useKayanStore(s => s.rooms)

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {rooms.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`kayan-tab ${selected === r.id ? 'active' : ''}`}
        >
          {r.name}
          <span className="opacity-50 text-[10px] ml-1">{r.name_ar}</span>
        </button>
      ))}
    </div>
  )
}
