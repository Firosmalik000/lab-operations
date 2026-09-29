import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
export const stock = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})

stock.definition = {
    methods: ["get","head"],
    url: '/inventory/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
stock.url = (options?: RouteQueryOptions) => {
    return stock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
stock.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
stock.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stock.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
    const stockForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stock.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
        stockForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryController::stock
 * @see app/Http/Controllers/InventoryController.php:20
 * @route '/inventory/stock'
 */
        stockForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stock.form = stockForm
/**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
export const movements = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movements.url(options),
    method: 'get',
})

movements.definition = {
    methods: ["get","head"],
    url: '/inventory/movements',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
movements.url = (options?: RouteQueryOptions) => {
    return movements.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
movements.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movements.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
movements.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movements.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
    const movementsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movements.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
        movementsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movements.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryController::movements
 * @see app/Http/Controllers/InventoryController.php:53
 * @route '/inventory/movements'
 */
        movementsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movements.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    movements.form = movementsForm
/**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/inventory/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventoryController::create
 * @see app/Http/Controllers/InventoryController.php:67
 * @route '/inventory/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:89
 * @route '/inventory/movements'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/movements',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:89
 * @route '/inventory/movements'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:89
 * @route '/inventory/movements'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:89
 * @route '/inventory/movements'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventoryController::store
 * @see app/Http/Controllers/InventoryController.php:89
 * @route '/inventory/movements'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const InventoryController = { stock, movements, create, store }

export default InventoryController