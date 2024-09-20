<script>
    document.addEventListener("DOMContentLoaded", function () {
        fetch('equipment-data.json')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('equipment-container');
                data.forEach(item => {
                    const equipmentItem = `
                        <div class="equipment-item">
                            <h2>${item.name}</h2>
                            <img src="${item.image}" alt="${item.name}" />
                            <p>${item.description}<br><strong>Rental Price:</strong> ${item.price}</p>
                        </div>
                    `;
                    container.innerHTML += equipmentItem;
                });
            });
    });
</script>