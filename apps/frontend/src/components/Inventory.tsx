import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define the type for inventory items
interface InventoryItem {
    id: string;
    name: string;
    expiryDate: string;
    imageSrc?: string;
}

// Define the type for API responses
interface FoodLabel {
    description: string;
}

// Function to detect food using an image recognition API
const detectFood = async (imageData: string) => {
    const apiEndpoint = '.'; // Replace with your API endpoint
    const apiKey = '.'; // Replace with your API key

    try {
        const response = await axios.post(apiEndpoint, { image: imageData }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data.labels || [];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('API Error Details:', error.response.data);
                return [{ description: 'banana' }];
            } else if (error.request) {
                console.error('No Response:', error.request);
                return [{ description: 'banana' }];
            } else {
                console.error('Error Message:', error.message);
                return [{ description: 'banana' }];
            }
        } else {
            console.error('Unexpected Error:', error);
            return [{ description: 'banana' }];
        }
    }
};

// Function to estimate expiry date based on description
const estimateExpiryDate = async (description: string) => {
    // Default expiry date of 7 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate.toISOString().split('T')[0];
};

// Function to get food name from description
const getFoodName = async (description: string) => {
    const apiKey = 'your-openai-api-key'; // OpenAI API key
    const endpoint = 'https://api.openai.com/v1/completions'; // Updated endpoint

    const prompt = `Given the description of a food item, determine its name. Description: ${description}`;

    try {
        const response = await axios.post(endpoint, {
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 50,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error Details:', error.response ? error.response.data : error.message);
        } else {
            console.error('Unexpected Error:', error);
        }
        return 'Banana';
    }
};

const Inventory: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    // Load inventory items from local storage when the component mounts
    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            const storedItems = localStorage.getItem('inventory');
            if (storedItems) {
                setItems(JSON.parse(storedItems));
            }
        }
    }, []);

    // Handle image upload and set the image source
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const imageData = reader.result as string;
                setImageSrc(imageData);
                setIsProcessing(true);
                setError(undefined);

                try {
                    // Call the image recognition API
                    const labels = await detectFood(imageData);
                    console.log('Detected labels:', labels);

                    // Determine food description from labels
                    const foodDescriptions = labels.map((label: { description: any; }) => label.description).join(', ');

                    if (foodDescriptions) {
                        // Automatically generate item details
                        const name = await getFoodName(foodDescriptions);
                        const expiryDate = await estimateExpiryDate(foodDescriptions);

                        if (name && expiryDate) {
                            const newItem: InventoryItem = {
                                id: Date.now().toString(),
                                name,
                                expiryDate,
                                imageSrc: imageData, // Ensure imageSrc is correctly set
                            };
                            const updatedItems = [...items, newItem];
                            setItems(updatedItems);

                            // Store in local storage
                            if (typeof localStorage !== 'undefined') {
                                localStorage.setItem('inventory', JSON.stringify(updatedItems));
                            }
                        }
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        setError(error.message);
                    }
                } finally {
                    setImageSrc(undefined);
                    setIsProcessing(false);
                }
            };
            reader.onerror = () => {
                setError('Failed to read file. Please try again.');
                setIsProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to delete an item
    const handleDelete = (id: string) => {
        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);

        // Update local storage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('inventory', JSON.stringify(updatedItems));
        }
    };

    // Function to check if an item is urgent (within 7 days of expiry)
    const isUrgent = (expiryDate: string) => {
        const currentDate = new Date();
        const expiry = new Date(expiryDate);
        const differenceInTime = expiry.getTime() - currentDate.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        return differenceInDays <= 7;
    };

    // Split items into urgent and normal categories
    const urgentItems = items.filter((item) => isUrgent(item.expiryDate));
    const normalItems = items.filter((item) => !isUrgent(item.expiryDate));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Inventory Manager</h1>

            {/* Form for adding items */}
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#f4f4f4', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Upload Image:
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ padding: '8px', width: '70%', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </label>
                {isProcessing && <p>Processing image, please wait...</p>}
                {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            </form>

            {/* Display inventory items side by side */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Urgent Inventory Section */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <h2 style={{ textAlign: 'center', color: '#ff4d4d', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #ff4d4d', paddingBottom: '10px', marginBottom: '20px' }}>Urgent Inventory</h2>
                    {urgentItems.length > 0 ? (
                        urgentItems.map((item) => (
                            <div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#fdf5f5' }}>
                                <h3 style={{ fontSize: '20px', color: '#333' }}>{item.name}</h3>
                                <p style={{ fontSize: '16px', marginBottom: '10px', color: '#555' }}>Expiry: {item.expiryDate}</p>
                                {item.imageSrc && <img src={item.imageSrc} alt={item.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '5px' }} />}
                                <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Delete</button>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999', fontSize: '16px' }}>No urgent items in inventory.</p>
                    )}
                </div>

                {/* Normal Inventory Section */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <h2 style={{ textAlign: 'center', color: '#333', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>Normal Inventory</h2>
                    {normalItems.length > 0 ? (
                        normalItems.map((item) => (
                            <div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#f4f4f4' }}>
                                <h3 style={{ fontSize: '20px', color: '#333' }}>{item.name}</h3>
                                <p style={{ fontSize: '16px', marginBottom: '10px', color: '#555' }}>Expiry: {item.expiryDate}</p>
                                {item.imageSrc && <img src={item.imageSrc} alt={item.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '5px' }} />}
                                <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#333', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Delete</button>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999', fontSize: '16px' }}>No items in inventory.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
