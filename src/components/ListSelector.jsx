export default function ListSelector({ lists = [], selectedListId, onSelect, onManageLists }) {
    return (
        <div className="list-selector">
            <select
                value={selectedListId || ''}
                onChange={(e) => {
                    if (e.target.value === '__MANAGE__') {
                        onManageLists && onManageLists()
                    } else {
                        onSelect(e.target.value)
                    }
                }}
                style={{ minWidth: '150px' }}
            >
                <option value="" disabled>Select List</option>
                {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                ))}
                <option disabled>──────────</option>
                <option value="__MANAGE__">⚙ Manage Lists</option>
            </select>
        </div>
    )
}
