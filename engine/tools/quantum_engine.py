import numpy as np
from qutip import Qobj, basis, sigmax, sigmay, sigmaz, tensor, mesolve

class QuantumLearner:
    """
    A class representing an evolving AI entity that learns and simulates quantum physics concepts.
    It starts with basic quantum mechanics simulations and can evolve by incorporating new methods or knowledge.
    
    Attributes:
        qubit_dim (int): Dimension of the qubit Hilbert space (default 2 for single qubit).
        evolution_var (dict): A dictionary to store evolved functionalities (e.g., new simulation methods).
    """
    
    def __init__(self, qubit_dim=2):
        self.qubit_dim = qubit_dim
        self.evolution_var = {}  # Implementation variable for evolution: stores new methods or data
    
    def simulate_superposition(self):
        """Simulate a qubit in superposition state (e.g., |+> = (|0> + |1>)/sqrt(2))."""
        state = (basis(self.qubit_dim, 0) + basis(self.qubit_dim, 1)).unit()
        print("Superposition state:")
        print(state)
        return state
    
    def simulate_entanglement(self):
        """Simulate two entangled qubits (Bell state: (|00> + |11>)/sqrt(2))."""
        bell_state = (tensor(basis(2, 0), basis(2, 0)) + tensor(basis(2, 1), basis(2, 1))).unit()
        print("Entangled Bell state:")
        print(bell_state)
        return bell_state
    
    def apply_pauli_operator(self, state, operator='X'):
        """Apply a Pauli operator (X, Y, Z) to a quantum state."""
        if operator == 'X':
            op = sigmax()
        elif operator == 'Y':
            op = sigmay()
        elif operator == 'Z':
            op = sigmaz()
        else:
            raise ValueError("Operator must be 'X', 'Y', or 'Z'.")
        
        result = op * state
        print(f"State after applying Pauli {operator}:")
        print(result)
        return result
    
    def simulate_time_evolution(self, initial_state, hamiltonian, times):
        """
        Simulate time evolution under a Hamiltonian.
        
        Args:
            initial_state (Qobj): Initial quantum state.
            hamiltonian (Qobj): Hamiltonian operator.
            times (list): List of time points for evolution.
        
        Returns:
            result: mesolve result object.
        """
        result = mesolve(hamiltonian, initial_state, times)
        print("Time evolution completed.")
        return result
    
    def evolve(self, new_func_name, new_func, description=""):
        """
        Evolve the learner by adding a new method or functionality.
        
        Args:
            new_func_name (str): Name of the new method to add.
            new_func (callable): The function to add as a method.
            description (str): Optional description of the new functionality.
        
        This allows the AI to grow by dynamically adding quantum simulation capabilities.
        """
        if new_func_name in dir(self):
            print(f"Function '{new_func_name}' already exists. Overwriting.")
        setattr(self, new_func_name, new_func)
        self.evolution_var[new_func_name] = description
        print(f"Evolved: Added '{new_func_name}' - {description}")
    
    def show_evolution(self):
        """Display current evolved functionalities."""
        if not self.evolution_var:
            print("No evolutions yet.")
        else:
            print("Current evolutions:")
            for name, desc in self.evolution_var.items():
                print(f"- {name}: {desc}")

# Example Usage
if __name__ == "__main__":
    artemis = QuantumLearner()
    
    # Basic simulations
    super_state = artemis.simulate_superposition()
    ent_state = artemis.simulate_entanglement()
    artemis.apply_pauli_operator(super_state, 'X')
    
    # Time evolution example
    H = sigmaz()  # Simple Hamiltonian
    times = np.linspace(0, 10, 100)
    artemis.simulate_time_evolution(super_state, H, times)
    
    # Evolve by adding a new method (example: add a function to compute expectation value)
    def compute_expectation(self, state, operator):
        """New evolved method: Compute expectation value <state|operator|state>."""
        return (state.dag() * operator * state).tr().real
    
    artemis.evolve('compute_expectation', compute_expectation, "Computes expectation value of an operator.")
    
    # Use the new evolved method
    exp_val = artemis.compute_expectation(super_state, sigmax())
    print(f"Expectation value of X on superposition: {exp_val}")
    
    artemis.show_evolution()
    
    # To further evolve: Call artemis.evolve() with new functions as needed when useful quantum insights are found.
