# ANP Tourism Portal

Welcome to the ANP Tourism Portal project! This project is designed to provide a comprehensive platform for tourism-related services, integrating both backend and frontend components.

## Project Structure

The project is organized into two main directories: `backend` and `frontend`.

### Backend

The backend is built using Python and includes the following components:

- **app**: Contains the main application logic.
  - `__init__.py`: Initializes the application package.
  - `main.py`: Entry point for the backend application, setting up the server and routing.
  - `config.py`: Configuration settings for the application, including database connection details.
  - `database.py`: Handles database connections and interactions.
  - **models**: Contains data models for the application.
    - `__init__.py`: Initializes the models package.
  - **routes**: Defines the API routes for the application.
    - `__init__.py`: Initializes the routes package.
  - **schemas**: Contains data validation schemas.
    - `__init__.py`: Initializes the schemas package.
  - **services**: Contains business logic and service functions.
    - `__init__.py`: Initializes the services package.
  - **utils**: Contains utility functions used throughout the application.
    - `__init__.py`: Initializes the utils package.
- `.env`: Contains environment variables for configuration.
- `requirements.txt`: Lists the Python dependencies required for the backend.
- `README.md`: Documentation for the backend.

### Frontend

The frontend is built using React and Vite, and includes the following components:

- **public**: Contains static assets for the frontend.
- **src**: Contains the source code for the frontend application.
  - **app**: Main application components.
    - `App.tsx`: Main application component that renders the application.
    - `routes.tsx`: Defines the routing for the frontend application.
    - `providers.tsx`: Sets up context providers for state management.
  - **components**: Contains reusable components.
    - **common**: Common reusable components.
    - **layout**: Layout components for the application.
    - **pages**: Page components for the application.
  - **hooks**: Custom hooks for managing state and side effects.
  - **lib**: Utility functions and libraries.
  - **services**: API service functions.
  - **styles**: Global styles for the application.
    - `index.css`: Contains global styles.
  - **types**: TypeScript type definitions.
  - `main.tsx`: Entry point for the frontend application, rendering the App component.
- `index.html`: Main HTML file for the frontend application.
- `package.json`: Configuration file for npm, listing dependencies and scripts for the frontend.
- `vite.config.ts`: Configuration settings for Vite.
- `tsconfig.json`: TypeScript configuration file for the frontend.
- `tsconfig.node.json`: TypeScript configuration for Node.js.
- `README.md`: Documentation for the frontend.

## Getting Started

To get started with the ANP Tourism Portal, follow these steps:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd ANP_TOURISM_PORTAL
   ```

2. **Set up the backend**:
   - Navigate to the `backend` directory.
   - Create a virtual environment and activate it.
   - Install the required dependencies:
     ```
     pip install -r requirements.txt
     ```
   - Set up your environment variables in the `.env` file.

3. **Run the backend**:
   ```
   python app/main.py
   ```

4. **Set up the frontend**:
   - Navigate to the `frontend` directory.
   - Install the required dependencies:
     ```
     npm install
     ```
   - Start the development server:
     ```
     npm run dev
     ```

5. **Access the application**:
   Open your browser and go to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.