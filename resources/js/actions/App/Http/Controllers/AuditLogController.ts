import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
const AuditLogController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AuditLogController.url(options),
    method: 'get',
})

AuditLogController.definition = {
    methods: ["get","head"],
    url: '/administration/audit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
AuditLogController.url = (options?: RouteQueryOptions) => {
    return AuditLogController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
AuditLogController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AuditLogController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
AuditLogController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: AuditLogController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
    const AuditLogControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: AuditLogController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
        AuditLogControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: AuditLogController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AuditLogController::__invoke
 * @see app/Http/Controllers/AuditLogController.php:12
 * @route '/administration/audit'
 */
        AuditLogControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: AuditLogController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    AuditLogController.form = AuditLogControllerForm
export default AuditLogController