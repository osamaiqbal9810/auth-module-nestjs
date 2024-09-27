import json
import random

def process_query(user_id, file_details, query, num_references, model, api_key):
    # Generate a mock answer string
    answer = f"Mock answer for query: '{query}' using model '{model}'"

    # Create mock references
    references = []
    for _ in range(num_references):
        reference = {
            "fileName": "MockFileName.pdf",
            "fileId": "66f3eee573a67e2b182fff42",  # Select a random fileId from the provided list
            "pageNo": random.randint(1, 10)  # Random page number
        }
        references.append(reference)

    # Generate mock token usage
    tokens_used = {
        "input": random.randint(100, 500),  # Mock input token count
        "output": random.randint(50, 200)   # Mock output token count
    }

    # Prepare the result as a dictionary
    result = {
        "answer": answer,
        "references": references,
        "tokensUsed": tokens_used
    }

    # Return the result
    return result

if __name__ == "__main__":
    # Sample input data
    user_id = "12345"
    file_details = [
        ("file1", [(1, 5)]),
        ("file2", [(6, 10)])
    ]
    query = "What is the meaning of life?"
    num_references = 2
    model = "mock-model"
    api_key = "example-api-key"

    # Process the query and get the result
    result = process_query(user_id, file_details, query, num_references, model, api_key)

    # Print the result as JSON
    print(json.dumps(result, indent=4))
