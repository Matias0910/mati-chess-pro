import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de informes de errores
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // Ejemplo: logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de fallback personalizada
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red', backgroundColor: '#333', borderRadius: '10px', margin: '20px' }}>
          <h1>¡Ups! Algo salió mal.</h1>
          <p>Por favor, recarga la página o inténtalo de nuevo más tarde.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', margin: '20px auto', maxWidth: '600px', border: '1px solid #555', padding: '10px', backgroundColor: '#222', color: '#eee' }}>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;