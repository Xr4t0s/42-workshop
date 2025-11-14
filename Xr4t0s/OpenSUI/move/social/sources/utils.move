module social::utils {

    public fun contains_addr(addr_list: &vector<address>, a: address): bool {
        let n = vector::length(addr_list);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(addr_list, i) == &a) return true;
            i = i + 1;
        };
        false
    }

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
