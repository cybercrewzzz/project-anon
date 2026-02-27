def call(String checkName, Closure body) {
    publishChecks name: checkName, status: 'IN_PROGRESS'
    try {
        body()
        publishChecks name: checkName, status: 'COMPLETED', conclusion: 'SUCCESS'
    } catch (Exception e) {
        publishChecks name: checkName, status: 'COMPLETED', conclusion: 'FAILURE'
        throw e
    }
}
