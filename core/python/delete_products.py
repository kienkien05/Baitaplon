from app import products_collection, transactions_collection, client

def delete_all_products():
    try:
        # Delete all products
        products_result = products_collection.delete_many({})
        print(f"Deleted {products_result.deleted_count} products from the database")
        
        # Delete all transactions
        transactions_result = transactions_collection.delete_many({})
        print(f"Deleted {transactions_result.deleted_count} transactions from the database")
    except Exception as e:
        print(f"Error deleting data: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    delete_all_products()