module social::utils {
    use std::vector;

	/*-------------------------------------------------------------------------------
		Fonctions utilitaires génériques sur les vecteurs d'adresses				|
		- contains_addr : teste la présence d'une adresse dans un vector<address>	|
		- remove_first_addr : supprime la première occurrence d'une adresse			|
																					|
		Ces helpers sont utilisés par le module `social::social` pour factoriser	|
		la logique de manipulation des listes (followed, comments, posts, etc.).	|
	-------------------------------------------------------------------------------*/

	/*
		Vérifie si une adresse est présente dans un vecteur d'adresses.

		addr_list:	référence immuable vers le vector<address> à parcourir
		a:			adresse à rechercher

		Retour:
		- true 	si `a` est trouvée dans `addr_list`
		- false sinon
	*/
    public fun contains_addr(addr_list: &vector<address>, a: address): bool {
        let n = vector::length(addr_list);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(addr_list, i) == &a) return true;
            i = i + 1;
        };
        false
    }

	/*
		Supprime la première occurrence d'une adresse dans un vecteur d'adresses.

		⚠ Cette fonction ne préserve pas l'ordre du vecteur :
		   - on swap l'élément trouvé avec le dernier
		   - puis on pop le dernier élément

		addr_list:	référence mutable vers le vector<address> à modifier
		a:			adresse à supprimer si présente

		Si `a` n'est pas trouvée, la fonction ne fait rien.
	*/
    public fun remove_first_addr(addr_list: &mut vector<address>, a: address) {
        let n = vector::length(addr_list);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(addr_list, i) == &a) {
                let last = n - 1;
                vector::swap(addr_list, i, last);
                vector::pop_back(addr_list);
                return
            };
            i = i + 1;
        }
    }
}
